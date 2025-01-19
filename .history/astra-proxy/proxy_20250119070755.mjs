import express from "express";
import fetch from "node-fetch";
import cors from "cors"; // Import the CORS middleware

const app = express();

// Enable CORS for all origins (you can adjust it for more specific origins if necessary)
app.use(cors());

// Middleware to parse JSON request bodies
app.use(express.json());

const ASTRA_DB_URL =
  "https://afe20104-f101-438c-9a11-279f7d6b1123-us-east1.apps.astra.datastax.com/api/rest/v2/keyspaces/artfinder/research_data";
const ASTRA_TOKEN =
  "AstraCS:nNsQefIJEEZhjcCGkGDLvWXM:fd9b17807a38a66c1cdf3fc9de58eb00bfa60be31204b0ba9614bc04ed4ecc7c";

// POST endpoint to store research data
app.post("/api/research_data", async (req, res) => {
  try {
    const response = await fetch(ASTRA_DB_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Cassandra-Token": ASTRA_TOKEN,
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      throw new Error(`Failed to store data: ${response.statusText}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error storing data:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch data", details: error.message });
  }
});

// Start the server
app.listen(3000, () =>
  console.log("Proxy server running on http://localhost:3000")
);
