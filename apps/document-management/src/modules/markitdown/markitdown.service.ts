import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { IMarkitdownService } from './markitdown.interface';

const execFileAsync = promisify(execFile);

@Injectable()
export class MarkitdownService implements IMarkitdownService {
  private readonly logger = new Logger(MarkitdownService.name);
  private readonly binPath: string;

  constructor(private readonly configService: ConfigService) {
    this.binPath = this.configService.getOrThrow('MARKITDOWN_BIN_PATH');
  }

  async convertToMarkdown(file: Buffer, fileName: string): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), 'markitdown-'));
    const filePath = join(dir, fileName);

    try {
      await writeFile(filePath, file);

      const { stdout } = await execFileAsync(this.binPath, [filePath], {
        maxBuffer: 1024 * 1024 * 50,
      });

      return stdout;
    } catch (error) {
      this.logger.error(
        `Markitdown conversion failed for file: ${fileName}`,
        error,
      );

      throw new InternalServerErrorException(
        'Failed to convert document to Markdown',
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }
}
