// Auto-detect environment — no need to manually flip IS_PROD
const IS_PROD = window.location.hostname !== "localhost";

const server = IS_PROD
  ? "https://meetchat-808p.onrender.com"
  : "http://localhost:8000";

export default server;