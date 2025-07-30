import cv2 as cv
import mediapipe as mp
import pyautogui as py
import math as m

tanganmp = mp.solutions.hands
hands = tanganmp.Hands(
    static_image_mode= False,
    model_complexity= 1,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
    max_num_hands=1
)
draw = mp.solutions.drawing_utils
screen_width, screen_height = py.size()

def deteksi_tangan(image):
    global klik_ditekan
    image_rgb = cv.cvtColor(image, cv.COLOR_BGR2RGB)
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
            cv.circle(image, (x, y), 10, (0, 255, 255), cv.FILLED) 
                       
            jempol = hand_landmarks.landmark[4]
            x_jempol = int(jempol.x * width)
            y_jempol = int(jempol.y * height)
            jarak = m.hypot(x_jempol - x, y_jempol - y)
            if jarak < 30:
                if not klik_ditekan:
                    klik_ditekan = True
                    py.click()
                    cv.circle(image, ((x + x_jempol)//2, (y + y_jempol)//2), 15, (0, 0, 255), cv.FILLED)
            else:
                klik_ditekan = False
    return image
  
cap = cv.VideoCapture(0)

while cap.isOpened():
    ret, image = cap.read()
    if not ret:
        print("Gambar gagal dibaca")
        break
    
    image = cv.flip(image, 1)
    image = deteksi_tangan(image)
    cv.imshow('Mouse gesture', image)
    if cv.waitKey(1) & 0xFF == ord('p'):
        print("Program dihentikan")
        break

cap.release()
cv.destroyAllWindows()

if __name__ == '_main_':
    print("Program selesai")
