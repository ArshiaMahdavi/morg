require("dotenv").config();

const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const productRoutes = require("./routes/products");
const adminRoutes = require("./routes/admin");
const { requireAdminPage } = require("./middleware/auth");

const app = express();
const port = Number(process.env.PORT || 3000);
const projectRoot = __dirname;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/uploads", express.static(path.join(projectRoot, "uploads")));

app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes);

app.get(["/admin", "/admin/"], requireAdminPage, (req, res) => {
  res.redirect("/admin/dashboard.html");
});

app.get("/admin/dashboard", requireAdminPage, (req, res) => {
  res.sendFile(path.join(projectRoot, "admin", "dashboard.html"));
});

app.get("/admin/dashboard.html", requireAdminPage, (req, res) => {
  res.sendFile(path.join(projectRoot, "admin", "dashboard.html"));
});

app.use(express.static(projectRoot));

app.use("/api", (req, res) => {
  res.status(404).json({ message: "مسیر API پیدا نشد." });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: "خطای داخلی سرور رخ داد." });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
