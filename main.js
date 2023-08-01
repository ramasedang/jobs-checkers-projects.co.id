import parsingJobs from "./service/project.co.id.js";

// funsi untuk run setiap 5 menit
const run = async () => {
  await parsingJobs();
  setTimeout(run, 300000);
};

const main = async () => {
  await run();
};

main();
