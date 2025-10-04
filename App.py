from flask import Flask, render_template, request, jsonify, send_file, Response
import cv2
import numpy as np
import os
import base64
from datetime import datetime
import threading
import time
import mediapipe as mp
import pyautogui as py
import math as m

app = Flask(__name__, static_folder='static', static_url_path='/static')
camera = None
camera_thread = None
camera_running = False
current_frame = None
selected_frame = "frame1.png"
captured_photos = []
selected_photos = []
hand_gesture_enabled = False

tanganmp = mp.solutions.hands
hands = tanganmp.Hands(
    static_image_mode=False,
    model_complexity=1,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
    max_num_hands=1
)
draw = mp.solutions.drawing_utils
screen_width, screen_height = py.size()
klik_ditekan = False
os.makedirs('static', exist_ok=True)
os.makedirs('assets', exist_ok=True)
os.makedirs('uploads', exist_ok=True)

def deteksi_tangan(image):
    global klik_ditekan
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    hasil = hands.process(image_rgb)
    if hasil.multi_hand_landmarks:
        for hand_landmarks in hasil.multi_hand_landmarks:
            draw.draw_landmarks(image, hand_landmarks, tanganmp.HAND_CONNECTIONS)

            landmark = hand_landmarks.landmark[8]
            height, width, _ = image.shape
            x = int(landmark.x * width)
            y = int(landmark.y * height)
            
            screen_x = int(landmark.x * screen_width)
            screen_y = int(landmark.y * screen_height)
            
            py.moveTo(screen_x, screen_y)
            cv2.circle(image, (x, y), 10, (0, 255, 255), cv2.FILLED) 
                       
            jempol = hand_landmarks.landmark[4]
            x_jempol = int(jempol.x * width)
            y_jempol = int(jempol.y * height)
            jarak = m.hypot(x_jempol - x, y_jempol - y)
            if jarak < 30:
                if not klik_ditekan:
                    klik_ditekan = True
                    py.click()
                    cv2.circle(image, ((x + x_jempol)//2, (y + y_jempol)//2), 15, (0, 0, 255), cv2.FILLED)
            else:
                klik_ditekan = False
    return image
  
class Camera:
    def __init__(self):
        self.cap = None
        self.is_running = False
        
    def start(self):
        if self.cap is None:
            self.cap = cv2.VideoCapture(0)
            if not self.cap.isOpened():
                for i in range(1, 5):
                    self.cap = cv2.VideoCapture(i)
                    if self.cap.isOpened():
                        break
                if not self.cap.isOpened():
                    raise Exception("No camera found")
        
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        self.is_running = True
        
    def get_frame(self):
        if self.cap and self.is_running:
            ret, frame = self.cap.read()
            if ret:
                frame = cv2.flip(frame, 1)
                return frame
        return None
    
    def capture_photo(self):
        frame = self.get_frame()
        if frame is not None:
            frame_with_overlay = self.add_frame_overlay(frame)
            return frame_with_overlay
        return None
    
    def add_frame_overlay(self, frame):
        try:
            frame_path = os.path.join('assets', selected_frame)
            if os.path.exists(frame_path):
                overlay = cv2.imread(frame_path, cv2.IMREAD_UNCHANGED)
                if overlay is not None:
                    overlay = cv2.resize(overlay, (frame.shape[1], frame.shape[0]))
                    if overlay.shape[2] == 4:
                        alpha = overlay[:, :, 3] / 255.0
                        for c in range(3):
                            frame[:, :, c] = frame[:, :, c] * (1 - alpha) + overlay[:, :, c] * alpha
                    else:
                        frame = cv2.addWeighted(frame, 0.7, overlay, 0.3, 0)
        except Exception as e:
            print(f"Error adding frame overlay: {e}")
        return frame
    
    def stop(self):
        self.is_running = False
        if self.cap:
            self.cap.release()
            self.cap = None
            
camera = Camera()

def generate_frames():
    while camera_running:
        frame = camera.get_frame()
        if frame is not None:
            if hand_gesture_enabled:
                frame = deteksi_tangan(frame)
            ret, buffer = cv2.imencode('.jpg', frame)
            if ret:
                frame_bytes = buffer.tobytes()
                yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        time.sleep(0.03)  


@app.route('/')
def index():
    return render_template('photobooth.html')

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    try:
        import os
        file_path = os.path.join('assets', filename)
        if os.path.exists(file_path):
            return send_file(file_path)
        else:
            return jsonify({'error': f'File {filename} not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/video_feed')
def video_feed():
    global camera_running
    if not camera_running:
        camera_running = True
        camera.start()
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/capture', methods=['POST'])
def capture_photo():
    global captured_photos
    try:
        data = request.get_json()
        timer = data.get('timer', 0) if data else 0
        photo_data = data.get('photo_data')
        if timer > 0:
            time.sleep(timer)
        if photo_data:
            photo_bytes = base64.b64decode(photo_data)
            photo_array = np.frombuffer(photo_bytes, dtype=np.uint8)
            photo = cv2.imdecode(photo_array, cv2.IMREAD_COLOR)
            if photo is not None:
                photo_with_frame = camera.add_frame_overlay(photo)
                ret, buffer = cv2.imencode('.jpg', photo_with_frame)
                if ret:
                    photo_base64 = base64.b64encode(buffer).decode('utf-8')
                    photo_id = len(captured_photos)
                    captured_photos.append({
                        'id': photo_id,
                        'data': photo_base64,
                        'timestamp': datetime.now().isoformat()
                    })
                    return jsonify({
                        'success': True,
                        'photo_id': photo_id,
                        'photo_data': photo_base64,
                        'total_photos': len(captured_photos)
                    })
        else:
            photo = camera.capture_photo()
            if photo is not None:
                ret, buffer = cv2.imencode('.jpg', photo)
                if ret:
                    photo_base64 = base64.b64encode(buffer).decode('utf-8')
                    photo_id = len(captured_photos)
                    captured_photos.append({
                        'id': photo_id,
                        'data': photo_base64,
                        'timestamp': datetime.now().isoformat()
                    })
                    return jsonify({
                        'success': True,
                        'photo_id': photo_id,
                        'photo_data': photo_base64,
                        'total_photos': len(captured_photos)
                    })
        return jsonify({'success': False, 'error': 'Failed to capture photo'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/select_frame', methods=['POST'])
def select_frame():
    global selected_frame
    try:
        data = request.get_json()
        frame_name = data.get('frame')
        if frame_name and os.path.exists(os.path.join('assets', frame_name)):
            selected_frame = frame_name
            return jsonify({'success': True, 'frame': selected_frame})
        return jsonify({'success': False, 'error': 'Frame not found'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/select_photos', methods=['POST'])
def select_photos():
    global selected_photos, captured_photos
    try:
        data = request.get_json()
        photo_ids = data.get('photo_ids', [])
        valid_photos = []
        for photo_id in photo_ids:
            if 0 <= photo_id < len(captured_photos):
                valid_photos.append(captured_photos[photo_id])
        selected_photos = valid_photos[:4]
        return jsonify({
            'success': True,
            'selected_count': len(selected_photos)
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/create_composition', methods=['POST'])
def create_composition():
    global selected_photos
    try:
        if len(selected_photos) < 4:
            return jsonify({'success': False, 'error': 'Need exactly 4 photos'})
        
        composition_width = 800
        composition_height = 600
        cell_width = composition_width // 2
        cell_height = composition_height // 2
        composition = np.zeros((composition_height, composition_width, 3), dtype=np.uint8)
        positions = [
            (0, 0), (0, cell_width),
            (cell_height, 0), (cell_height, cell_width)
        ]
        
        for i, photo_data in enumerate(selected_photos):
            if i >= 4:
                break
            photo_bytes = base64.b64decode(photo_data['data'])
            photo_array = np.frombuffer(photo_bytes, dtype=np.uint8)
            photo = cv2.imdecode(photo_array, cv2.IMREAD_COLOR)
            if photo is not None:
                photo_resized = cv2.resize(photo, (cell_width, cell_height))
                y, x = positions[i]
                composition[y:y+cell_height, x:x+cell_width] = photo_resized
                
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"photobooth_{timestamp}.jpg"
        filepath = os.path.join('uploads', filename)
        cv2.imwrite(filepath, composition)
        ret, buffer = cv2.imencode('.jpg', composition)
        if ret:
            composition_base64 = base64.b64encode(buffer).decode('utf-8')
            return jsonify({
                'success': True,
                'filename': filename,
                'composition_data': composition_base64
            })
        return jsonify({'success': False, 'error': 'Failed to create composition'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/download/<filename>')
def download_file(filename):
    try:
        filepath = os.path.join('uploads', filename)
        if os.path.exists(filepath):
            return send_file(filepath, as_attachment=True)
        else:
            return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/reset', methods=['POST'])
def reset_session():
    global captured_photos, selected_photos
    try:
        captured_photos = []
        selected_photos = []
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/status')
def get_status():
    return jsonify({
        'camera_running': camera_running,
        'captured_photos': len(captured_photos),
        'selected_photos': len(selected_photos),
        'selected_frame': selected_frame
    })

@app.route('/hand_gesture', methods=['POST'])
def start_hand_gesture():
    global hand_gesture_enabled
    try:
        hand_gesture_enabled = True
        print("Hand gesture mode enabled")
        return jsonify({'success': True, 'message': 'Hand gesture mode started'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/hand_gesture', methods=['DELETE'])
def stop_hand_gesture():
    global hand_gesture_enabled
    try:
        hand_gesture_enabled = False
        print("Hand gesture mode disabled")
        return jsonify({'success': True, 'message': 'Hand gesture mode stopped'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

def main_menu():
    while True:
        print("\n" + "="*50)
        print("           SiPhot - Digital Photobooth")
        print("="*50)
        print("1. Web Photobooth Mode")
        print("2. Exit")
        print("="*50)
        
        choice = input("Pilih mode (1-2): ").strip() 
        if choice == '1':
            print("\nStarting Web Photobooth Mode...")
            print("Access the application at: http://localhost:5000")
            try:
                camera.start()
                camera_running = True
                app.run(debug=False, host='0.0.0.0', port=5000)
            except KeyboardInterrupt:
                print("\nShutting down web mode...")
            except Exception as e:
                print(f"Error in web mode: {e}")
            finally:
                camera.stop()
                camera_running = False
                
        elif choice == '2':
            print("\nTerima kasih telah menggunakan SiPhot!")
            break
        else:
            print("Silakan pilih  antara 1 atau 2.")

if __name__ == '__main__':
    try:
        print("Starting SiPhot Application...")
        main_menu()
    except KeyboardInterrupt:
        print("\nShutting down...")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        camera.stop()
        camera_running = False
        print("Application stopped.")
