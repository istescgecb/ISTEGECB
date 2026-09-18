const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

/* ================================= CONFIG VARIABLES ================================== */
const TARGET_DIR = "assets/img/Past events"; // path
const TARGET_WIDTH = 600; // dimensions
const TARGET_HEIGHT = 600;

// files to be processs
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic"];
const ORG_DIR = `${TARGET_DIR}-org`;

// Trackers for total file sizes
let totalOriginalBytes = 0;
let totalOptimizedBytes = 0;

async function processImage(inputPath, outputPath) {
    try {
        const stat = fs.statSync(inputPath);
        totalOriginalBytes += stat.size;
        const origMB = (stat.size / (1024 * 1024)).toFixed(3);

        const ext = path.extname(inputPath).toLowerCase();

        // 1. Read image metadata to check dimensions
        const metadata = await sharp(inputPath).metadata();
        const origDims = `${metadata.width}x${metadata.height}`;

        // 2. Ignore/Copy if already at or below target dimensions (TARGET_WIDTHpx)
        if (metadata.width <= TARGET_WIDTH && metadata.height <= TARGET_HEIGHT && ext !== ".heic") {
            fs.copyFileSync(inputPath, outputPath);
            totalOptimizedBytes += stat.size;
            console.log(`SKIP ${inputPath} => ${origMB} mb | ${origDims} (Already at target dimensions)`);
            return;
        }

        // 3. Otherwise, process the image
        let pipeline = sharp(inputPath).resize({
            width: TARGET_WIDTH,
            height: TARGET_HEIGHT,
            fit: "inside",
            withoutEnlargement: true
        });

        if (ext === ".jpg" || ext === ".jpeg") {
            pipeline = pipeline.jpeg({ quality: 90, mozjpeg: true });
        } else if (ext === ".png") {
            pipeline = pipeline.png({ quality: 90, compressionLevel: 9 });
        } else if (ext === ".webp") {
            // Quality lowered slightly to help offset the file size bloat
            pipeline = pipeline.webp({ quality: 80 });
        } else if (ext === ".heic") {
            outputPath = outputPath.replace(/\.heic$/i, ".jpg");
            pipeline = pipeline.jpeg({ quality: 90, mozjpeg: true });
        }

        // toFile returns an info object containing the new dimensions
        const info = await pipeline.toFile(outputPath);
        const newDims = `${info.width}x${info.height}`;

        // Check the newly created file size
        const outStat = fs.statSync(outputPath);
        totalOptimizedBytes += outStat.size;

        const optMB = (outStat.size / (1024 * 1024)).toFixed(3);

        // Let you know if it gained weight, but KEEP it anyway
        if (outStat.size > stat.size) {
            console.log(`OK (LARGER) ${inputPath} => ${origMB} mb -> ${optMB} mb | ${origDims} -> ${newDims}`);
        } else {
            console.log(`OK          ${inputPath} => ${origMB} mb -> ${optMB} mb | ${origDims} -> ${newDims}`);
        }

    } catch (err) {
        console.error(`ERR  ${inputPath}`, err.message);
    }
}

async function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            await walk(fullPath);
            continue;
        }

        const relativePath = path.relative(ORG_DIR, fullPath);
        const outputPath = path.join(TARGET_DIR, relativePath);

        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        const ext = path.extname(entry.name).toLowerCase();

        if (IMAGE_EXTENSIONS.includes(ext)) {
            await processImage(fullPath, outputPath);
        } else {
            const stat = fs.statSync(fullPath);
            totalOriginalBytes += stat.size;
            totalOptimizedBytes += stat.size;

            fs.copyFileSync(fullPath, outputPath);
            console.log(`COPY ${fullPath}`);
        }
    }
}

(async () => {
    if (fs.existsSync(TARGET_DIR) && !fs.existsSync(ORG_DIR)) {
        console.log(`Renaming folder '${TARGET_DIR}' to '${ORG_DIR}'...`);
        fs.renameSync(TARGET_DIR, ORG_DIR);
    } else if (!fs.existsSync(ORG_DIR)) {
        console.error(`Error: The source directory '${TARGET_DIR}' does not exist.`);
        process.exit(1);
    } else {
        console.log(`'${ORG_DIR}' already exists. Resuming process...`);
    }

    fs.mkdirSync(TARGET_DIR, { recursive: true });

    console.log(`\nProcessing files from '${ORG_DIR}' into '${TARGET_DIR}'...\n`);
    await walk(ORG_DIR);

    const origMB = totalOriginalBytes / (1024 * 1024);
    const optMB = totalOptimizedBytes / (1024 * 1024);
    const savedMB = origMB - optMB;
    const reducedPercent = origMB > 0 ? (savedMB / origMB) * 100 : 0;

    console.log(`\nDone. Recreated and populated ${TARGET_DIR}`);
    console.log(`----------------------------------------`);
    console.log(`Reduced   : ${reducedPercent.toFixed(2)} %`);
    console.log(`Saved     : ${savedMB.toFixed(2)} MB`);
    console.log(`Optimized : ${optMB.toFixed(2)} MB`);
    console.log(`Original  : ${origMB.toFixed(2)} MB`);
    console.log(`----------------------------------------\n`);
})();