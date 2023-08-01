import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";

const getHtml = async () => {
  try {
    const response = await axios.get(
      "https://projects.co.id/public/browse_projects/listing",
      {
        params: {
          filter: "newest",
          page: "1",
          ajax: "1",
        },
      }
    );
    // console.log(response);
    fs.writeFileSync("data/project.co.id.html", response.data);
    return response;
  } catch (error) {
    console.error(error);
  }
};

const parseJobDetails = (jobDetails) => {
  const startIndex = jobDetails.indexOf("Published Budget:");
  const endIndex = jobDetails.indexOf("Published Date:");
  const budget = jobDetails
    .substring(startIndex, endIndex)
    .replace("Published Budget:", "")
    .trim();

  const startIndexFinish = jobDetails.indexOf("Finish Days:");
  const finishDays = jobDetails
    .substring(startIndexFinish)
    .replace("Finish Days:", "")
    .trim();

  return { budget, finishDays };
};

const compareAndLogUpdate = (currentData, newData) => {
  const isDifferent =
    currentData.title !== newData.title ||
    currentData.description !== newData.description ||
    currentData.budget !== newData.budget ||
    currentData.finishDays !== newData.finishDays;

  if (isDifferent) {
    console.log("Update:", newData);
  }

  return isDifferent;
};

const parsingJobs = async () => {
  const html = await getHtml();
  const $ = cheerio.load(html.data);

  const title = $(
    "body > div.form.form-horizontal > div > div:nth-child(3) > div.col-md-10.align-left > h2 > a"
  )
    .text()
    .trim();

  console.log(title);

  const description = $(
    "body > div.form.form-horizontal > div > div:nth-child(3) > div.col-md-10.align-left > p:nth-child(2)"
  )
    .text()
    .trim();

  const jobDetailsText = $(
    "body > div.form.form-horizontal > div > div:nth-child(3) > div.col-md-10.align-left > div > div > div:nth-child(1)"
  ).text();

  const { budget, finishDays } = parseJobDetails(jobDetailsText);

  const newData = { title, description, budget, finishDays };

  const filePath = "data/project.co.id.json";

  try {
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync("data", { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(newData));
      return;
    }
    const currentDataRaw = fs.readFileSync(filePath, "utf-8");
    const currentData = JSON.parse(currentDataRaw);
    const shouldUpdate = compareAndLogUpdate(currentData, newData);
    if (shouldUpdate) {
      let webhooks =
        "https://discord.com/api/webhooks/1135946592378159255/zUq02QSAG0xKXH8_Jt2jkznzCwHCTyZQlmj9Kh2Dhu8O8gsUd4_FfJim3c4VdA63VTOt";
      axios.post(webhooks, {
        content: `**Update:** ${newData.title}\n\n**Deskripsi:**\n${newData.description}\n\n**Budget:** ${newData.budget}\n**Estimasi Selesai:** ${newData.finishDays}`,
      });
      fs.writeFileSync(filePath, JSON.stringify(newData));
    }
  } catch (error) {
    console.error("Error reading the JSON file:", error);
  }
};

export default parsingJobs;
