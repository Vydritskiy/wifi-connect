/* ============================================================
   Wi-Fi Guest Portal — main.css (оптимизированная версия)
   ============================================================ */

/* Основные стили страницы */
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
  background: #f4f4f4;
  color: #333;
}

/* Контейнер с контентом */
.wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
}

h1 {
  font-size: 32px;
  color: #333;
  margin-bottom: 20px;
}

.welcome {
  font-size: 24px;
  margin-bottom: 20px;
  color: #2d2d2d;
  text-align: center;
}

.card {
  width: 100%;
  max-width: 400px;
  padding: 20px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.hero-art {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.hero-art img {
  max-width: 100%;
  border-radius: 10px;
}

.carousel-shell {
  margin-bottom: 20px;
  position: relative;
}

.carousel {
  display: flex;
  overflow: hidden;
}

.track {
  display: flex;
  transition: transform 0.5s ease;
}

.slide {
  flex: 0 0 100%;
  padding: 10px;
  background-color: #f8f8f8;
  border-radius: 10px;
  box-sizing: border-box;
  margin-right: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.slide img {
  width: 100%;
  height: auto;
  border-radius: 10px;
  margin-bottom: 10px;
}

.dots {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.dots span {
  width: 10px;
  height: 10px;
  margin: 0 5px;
  background-color: #bbb;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.dots .active {
  background-color: #5f5f5f;
}

/* Кнопки */
button {
  width: 100%;
  padding: 12px;
  margin-bottom: 15px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
}

button:hover {
  background-color: #45a049;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

/* Панель администрирования */
.admin-toggle {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 24px;
  cursor: pointer;
}

.admin-panel {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
  justify-content: center;
  align-items: center;
}

.admin-panel .admin-inner {
  background: #fff;
  padding: 30px;
  border-radius: 10px;
  max-width: 400px;
  width: 100%;
}

.admin-panel .admin-close {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 24px;
  cursor: pointer;
}

.admin-row {
  margin-bottom: 15px;
}

.admin-row label {
  display: block;
  margin-bottom: 5px;
}

.admin-row input {
  width: 100%;
  padding: 8px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.admin-actions {
  display: flex;
  justify-content: space-between;
}

.admin-btn {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.admin-btn.reset {
  background-color: #f44336;
}

.admin-btn:hover {
  background-color: #45a049;
}

/* Карточка с тестом скорости */
.speed-card {
  display: none;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 10px;
  margin-top: 20px;
}

.speed-card .speed-title {
  font-size: 18px;
  font-weight: bold;
}

.speed-row {
  font-size: 14px;
  margin-bottom: 10px;
}

.speed-status {
  font-size: 16px;
  font-weight: bold;
}

.good {
  color: green;
}

.mid {
  color: orange;
}

.bad {
  color: red;
}

/* Погода */
.weather-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #e0e0e0;
  padding: 15px;
  border-radius: 10px;
  margin-top: 20px;
}

.weather-row {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.weather-city {
  font-size: 18px;
  font-weight: bold;
}

.weather-main {
  font-size: 16px;
  margin-left: 10px;
}

.weather-icon {
  width: 60px;
  height: 60px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.weather-temp-block {
  display: flex;
  justify-content: center;
  align-items: center;
}

.weather-temp {
  font-size: 36px;
  font-weight: bold;
}

.weather-meta {
  font-size: 12px;
  margin-top: 5px;
}

/* Анимация фоновых картинок погоды */
.weather-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('icons/weather-sunny.svg') no-repeat center center fixed;
  background-size: cover;
  z-index: -1;
  opacity: 0.5;
  transition: background 0.5s ease;
}

/* Всплывающие окна и модальные окна */
.qr-box {
  display: none;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  text-align: center;
  z-index: 100;
}

.qr-box img {
  max-width: 100%;
  height: auto;
}

/* Переходы и анимации */
@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

.fade-in {
  animation: fadeIn 1s ease-out;
}

@media (max-width: 600px) {
  .wrapper {
    margin-top: 10px;
  }

  .card {
    width: 90%;
    padding: 15px;
  }

  .hero-art img {
    max-width: 80%;
  }
}
