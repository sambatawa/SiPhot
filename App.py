import cv2 as cv
import mediapipe as mp

tanganmp = mp.solutions.hands
hands = tanganmp.Hands(
    static_image_mode= False,
    model_complexity= 1,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
    max_num_hands=1
)
draw = mp.solutions.drawing_utils

def deteksi_tangan(image):
    image_rgb = cv.cvtColor(image, cv.COLOR_BGR2RGB)
    hasil = hands.process(image_rgb)
    if hasil.multi_hand_landmarks:
        for hand_landmarks in hasil.multi_hand_landmarks:
            draw.draw_landmarks(image, hand_landmarks, tanganmp.HAND_CONNECTIONS)
    return image
  
cap = cv.VideoCapture(0)
while cap.isOpened():
    ret, image = cap.read()
    if not ret:
        print("Gambar gagal dibaca")
        break

    image = deteksi_tangan(image)
    cv.imshow('Keyboard hand gesture', image)
    if cv.waitKey(1) & 0xFF == ord('p'):
        print("Program dihentikan")
        break

cap.release()
cv.destroyAllWindows()

if __name__ == '_main_':
    print("Program selesai")
