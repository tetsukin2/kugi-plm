// const express = require("express");
// const cors = require("cors");
// const app = express();

// app.use(cors());
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
//   res.header("Access-Control-Allow-Headers", "Content-Type");
//   next();
// });

// app.get("/proxy", async (req, res) => {
//   const targetUrl = req.query.url;
//   if (!targetUrl) {
//     return res.status(400).json({ error: "Missing target URL" });
//   }
//   try {
//     const response = await fetch(targetUrl);
//     const data = await response.json();
//     res.json(data);
//   } catch (error) {
//     res.status(500).json({ error: "Error fetching data" });
//   }
// });

// const PORT = process.env.PORT || 8080;
// app.listen(PORT, () => console.log(`CORS Proxy running on port ${PORT}`));

import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/proxy", async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: "Missing target URL" });
  }
  try {
    const response = await fetch(targetUrl);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Error fetching data" });
  }
});

app.post("/proxy", async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: "Missing target URL" });
  }
  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });

    const responseData = await response.json();
    res.json(responseData);
  } catch (error) {
    res.status(500).json({ error: "Error forwarding POST request" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`CORS Proxy running on port ${PORT}`));
