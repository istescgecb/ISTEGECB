const fs = require("fs");
const { JSDOM } = require("jsdom");

const inputFile = "pastEvents.html";
const outputDir = "./pages";

if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
}
fs.mkdirSync(outputDir);

let rawHtml = fs.readFileSync(inputFile, "utf-8");
rawHtml = rawHtml.replace(/<!--[\s\S]*?-->/g, "");

const dom = new JSDOM(rawHtml);
const document = dom.window.document;

const allSwipers = Array.from(document.querySelectorAll("div.swiper.mySwiper2"));


const chunks = [];
for (let i = 0; i < allSwipers.length; i += 8) {
    const chunk = allSwipers.slice(i, i + 8);
    chunks.push(chunk);
}

chunks.forEach((chunk, index) => {
  const chunkHTML = chunk.map(swiper => swiper.outerHTML).join("\n");
  fs.writeFileSync(`${outputDir}/page${index + 1}.html`, chunkHTML.trim(), "utf-8");
  console.log(`Created: page${index + 1}.html`);
});

const countPages = chunks.length;
fs.writeFileSync(`${outputDir}/page-count.txt`, countPages.toString(), "utf-8");
console.log(`pages count: ${countPages}`)

// const sbmSwipers = Array.from(document.querySelectorAll("div.swiper.mySwiper"));
// console.log("sbmSwipers found?", !!sbmSwipers);

// if (sbmSwipers) {
//     fs.writeFileSync("sbm-page.html", sbmSwipers.outerHTML, "utf-8");
//     console.log("Created: sbm-page.html");
// }
// else {
//   console.error("Error: element 'div.swiper.mySwiper' not found!");
// }



