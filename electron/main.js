const { app, BrowserWindow } = require("electron");
const path = require("path");

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
  });

  // Đảm bảo Next.js chạy trên chế độ development hoặc production
  win.loadURL("http://localhost:3000"); // Địa chỉ Next.js khi phát triển
  win.webContents.openDevTools(); // cái này là cho phép bạn sử dụng devtool như browser để dùng cho debug thôi, không có gì đặc biệt

  // win.loadFile(path.join(__dirname, 'out/index.html')); // Dùng khi deploy production

  win.on("closed", () => {
    win = null;
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (win === null) {
    createWindow();
  }
});
