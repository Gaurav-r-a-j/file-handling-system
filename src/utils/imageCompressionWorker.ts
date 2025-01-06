// const { parentPort, workerData } = require("worker_threads");
// const { execSync } = require("child_process");
// const fs = require("fs").promises;
// const path = require("path");

// const { file, options, localDownloadDir } = workerData;
// // const squooshedImagesPath = path.resolve("/tmp/squooshed-images");
// const squooshedImagesPath = "/tmp/squooshed-images";
// // process.env.NODE_ENV !== "productoin" ? path.resolve("squooshed-images") : "/tmp/squooshed-images";

// async function compressImage() {
//   try {
//     if (!localDownloadDir || !file || !file.originalname) {
//       throw new Error(
//         "Required data is missing: localDownloadDir or file properties"
//       );
//     }

//     const inputPath = `${file.destination}/${file.originalname}`;
//     // const inputPath = path.join(localDownloadDir, file.originalname);
//     console.log(`Input path for file: ${inputPath}`);

//     // Define the output file path in the squooshed-images folder
//     const outputFileName = file.originalname.replace(
//       /\.(png|jpg|jpeg|gif)$/i,
//       `.${options.format}`
//     );
//     // const outputFilePath = path.join(squooshedImagesPath, outputFileName);
//     const outputFilePath = `${file.destination}/squoshed-images/${file.originalname}`;
//     // Ensure the squooshed-images folder exists
//     const tmpFolder = path.join("/tmp", "squooshed-images");

//     // Ensure the directory exists in /tmp
//     await fs.mkdir(tmpFolder, { recursive: true });

//     const command = `npx squoosh-cli --resize "{ width: 600, height: 600 }" --webp "{ quality: 100 }" "${inputPath}" --output-dir "${squooshedImagesPath}"`;

//     execSync(command);

//     // console.log("Output file path:", outputFilePath);

//     // Read the compressed file
//     const data = await fs.readFile(outputFilePath);

//     // Prepare details of the squooshed file
//     const newFileDetails = {
//       originalname: file.originalname,
//       compressedname: outputFileName,
//       path: outputFilePath,
//       format: options.format,
//       size: data.length, // size of the compressed file in bytes
//       buffer: data,
//     };

//     // console.log("New file details:", newFileDetails);

//     // Clean up the input and output files
//     await fs.unlink(inputPath);
//     await fs.unlink(outputFilePath);

//     // Send the compressed file details back
//     parentPort.postMessage(newFileDetails);
//   } catch (error) {
//     parentPort.postMessage({ error: error.message });
//   }
// }

// compressImage();
