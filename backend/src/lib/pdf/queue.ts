import { redis } from "../cache/redis.js";

export interface PdfJob {
    id: string;
    chapterId: string;
    status: "pending" | "processing" | "completed" | "failed";
    pagesCount?: number;
    error?: string;
    createdAt: number;
}

const JOB_TTL = 86400;

export const pdfQueue = {
    async createJob(chapterId: string): Promise<string> {
        const jobId = `pdf-${chapterId}-${Date.now()}`;
        const job: PdfJob = {
            id: jobId,
            chapterId,
            status: "pending",
            createdAt: Date.now(),
        };
        await redis.set(`job:${jobId}`, job, { ex: JOB_TTL });
        await redis.lpush("pdf-queue", jobId);
        return jobId;
    },

    async getJob(jobId: string): Promise<PdfJob | null> {
        return redis.get<PdfJob>(`job:${jobId}`);
    },

    async updateJob(jobId: string, updates: Partial<PdfJob>): Promise<void> {
        const job = await this.getJob(jobId);
        if (job) {
            await redis.set(
                `job:${jobId}`,
                { ...job, ...updates },
                { ex: JOB_TTL },
            );
        }
    },

    async dequeueJob(): Promise<string | null> {
        return redis.rpop("pdf-queue");
    },
};
