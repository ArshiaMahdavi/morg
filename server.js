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

const sendPage = (pageName) => (req, res) => {
  res.sendFile(path.join(projectRoot, pageName));
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/assets", express.static(path.join(projectRoot, "assets"), { index: false }));
app.use("/css", express.static(path.join(projectRoot, "css"), { index: false }));
app.use("/image", express.static(path.join(projectRoot, "image"), { index: false }));
app.use("/js", express.static(path.join(projectRoot, "js"), { index: false }));
app.use("/uploads", express.static(path.join(projectRoot, "uploads"), { index: false }));

app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes);

app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

app.get(["/", "/index.html"], sendPage("index.html"));
app.get("/products.html", sendPage("products.html"));
app.get("/product-detail.html", sendPage("product-detail.html"));
app.get("/services.html", sendPage("services.html"));
app.get("/about.html", sendPage("about.html"));
app.get("/contact.html", sendPage("contact.html"));

app.get("/admin/admin.css", (req, res) => {
  res.sendFile(path.join(projectRoot, "admin", "admin.css"));
});

app.get("/admin/admin.js", (req, res) => {
  res.sendFile(path.join(projectRoot, "admin", "admin.js"));
});

app.get(["/admin/login", "/admin/login.html"], (req, res) => {
  res.sendFile(path.join(projectRoot, "admin", "login.html"));
});

app.get(["/admin", "/admin/"], requireAdminPage, (req, res) => {
  res.redirect("/admin/dashboard.html");
});

app.get("/admin/dashboard", requireAdminPage, (req, res) => {
  res.sendFile(path.join(projectRoot, "admin", "dashboard.html"));
});

app.get("/admin/dashboard.html", requireAdminPage, (req, res) => {
  res.sendFile(path.join(projectRoot, "admin", "dashboard.html"));
});

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
