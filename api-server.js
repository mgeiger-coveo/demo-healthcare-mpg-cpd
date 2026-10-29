const express = require("express");
const { PlatformClient, RestUserIdType } = require("@coveo/platform-client");
require("dotenv").config();

const app = express();
app.use(express.json());

// CORS for development
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/api/token", async (req, res) => {
  try {
    if (
      !process.env.PLATFORM_URL ||
      !process.env.ORGANIZATION_ID ||
      !process.env.API_KEY ||
      !process.env.USER_EMAIL
    ) {
      return res.status(500).json({
        message: "Missing required environment variables",
      });
    }

    const platform = new PlatformClient({
      host: process.env.PLATFORM_URL,
      organizationId: process.env.ORGANIZATION_ID,
      accessToken: process.env.API_KEY,
    });

    const tokenData = await platform.search.createToken({
      userIds: [
        {
          name: process.env.USER_EMAIL,
          provider: "Email Security Provider",
          type: RestUserIdType.User,
        },
      ],
    });

    res.json({ token: tokenData.token });
  } catch (error) {
    console.error("Token generation error:", error);
    res.status(error.statusCode || 500).json({
      message: error.message || "Failed to generate token",
    });
  }
});

app.post("/api/token", async (req, res) => {
  try {
    if (
      !process.env.PLATFORM_URL ||
      !process.env.ORGANIZATION_ID ||
      !process.env.API_KEY ||
      !process.env.USER_EMAIL
    ) {
      return res.status(500).json({
        message: "Missing required environment variables",
      });
    }

    const { userEmail, dictionaryFieldContext } = req.body;

    const platform = new PlatformClient({
      host: process.env.PLATFORM_URL,
      organizationId: process.env.ORGANIZATION_ID,
      accessToken: process.env.API_KEY,
    });

    const tokenParams = {
      userIds: [
        {
          name: userEmail || process.env.USER_EMAIL,
          provider: "Email Security Provider",
          type: RestUserIdType.User,
        },
      ],
    };

    if (
      dictionaryFieldContext &&
      Object.keys(dictionaryFieldContext).length > 0
    ) {
      tokenParams.dictionaryFieldContext = dictionaryFieldContext;
    }

    const tokenData = await platform.search.createToken(tokenParams);

    res.json({ token: tokenData.token });
  } catch (error) {
    console.error("Token generation error:", error);
    res.status(error.statusCode || 500).json({
      message: error.message || "Failed to generate token",
    });
  }
});

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server listening at http://localhost:${PORT}`);
});
