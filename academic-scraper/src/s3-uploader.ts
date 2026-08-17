import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface UploadOptions {
  bucketName: string;
  downloadsDir: string;
  region?: string;
  dryRun?: boolean;
}

export function syncDownloadsToS3(options: UploadOptions): { uploaded: number; errors: number } {
  const { bucketName, downloadsDir, dryRun = false } = options;
  let uploaded = 0;
  let errors = 0;

  if (!fs.existsSync(downloadsDir)) {
    console.error(`[S3 Uploader] Local downloads directory '${downloadsDir}' does not exist.`);
    return { uploaded: 0, errors: 1 };
  }

  const careerFolders = fs.readdirSync(downloadsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory());

  for (const careerDir of careerFolders) {
    const careerName = careerDir.name;
    const careerPath = path.join(downloadsDir, careerName);

    const courseFolders = fs.readdirSync(careerPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory());

    for (const courseDir of courseFolders) {
      const courseName = courseDir.name;
      const coursePath = path.join(careerPath, courseName);

      const files = fs.readdirSync(coursePath).filter((f) => f.endsWith('.pdf'));

      for (const file of files) {
        const localFilePath = path.join(coursePath, file);
        // S3 Deterministic Key: s3://<bucket-name>/careers/<career-name>/<course-name>_<filename>
        const s3Key = `careers/${careerName}/${courseName}_${file}`;
        const s3Uri = `s3://${bucketName}/${s3Key}`;

        console.log(`[S3 Uploader] Uploading ${localFilePath} -> ${s3Uri}`);

        if (!dryRun) {
          try {
            execSync(`aws s3 cp "${localFilePath}" "${s3Uri}"`, { stdio: 'inherit' });
            uploaded++;
          } catch (err) {
            console.error(`[S3 Uploader] Failed to upload ${localFilePath}:`, err);
            errors++;
          }
        } else {
          uploaded++;
        }
      }
    }
  }

  return { uploaded, errors };
}

// Allow CLI execution if called directly
if (require.main === module) {
  const bucketName = process.env.S3_BUCKET_NAME || 'academic-assistant-syllabi-bucket';
  const downloadsDir = path.resolve(__dirname, '../downloads');
  const dryRun = process.argv.includes('--dry-run');

  console.log(`[S3 Uploader] Starting sync to S3 bucket: ${bucketName}`);
  const result = syncDownloadsToS3({ bucketName, downloadsDir, dryRun });
  console.log(`[S3 Uploader] Completed: ${result.uploaded} uploaded, ${result.errors} errors.`);
}
