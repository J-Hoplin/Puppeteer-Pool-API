import { RequestHandler } from 'express';
import { responseFn } from '../common/response';
import * as process from 'node:process';
import { getPoolMetrics } from '../pool/manager';

function transformBytesToGB(bytes: number): string {
  return (bytes / 1024 / 1024 / 1024).toFixed(2);
}

export const healthCheckController: RequestHandler = (req, res) => {
  return responseFn(res, 200, 'OK');
};

export const processMetricCheckController: RequestHandler = async (
  req,
  res,
) => {
  const puppeteerPoolMetrics = await getPoolMetrics();

  const proctorTimeOutMS = 100;
  const memoryUsage = process.memoryUsage();
  const startCPUUsage = process.cpuUsage();
  const elapsedStart = Date.now();
  // Memory usage
  const RSS = transformBytesToGB(memoryUsage.rss);
  const heapTotal = transformBytesToGB(memoryUsage.heapTotal);
  const heapUsed = transformBytesToGB(memoryUsage.heapUsed);
  const external = transformBytesToGB(memoryUsage.external);
  // CPU
  setTimeout(() => {
    const endCPUUsage = process.cpuUsage(startCPUUsage);
    const elapsedEnd = Date.now();
    const elapsedTime = (elapsedEnd - elapsedStart) / 1000;
    const processCPUTime = endCPUUsage.user / 1000;
    const physicalCPUTime = endCPUUsage.system / 1000;
    const cpuUsagePercent =
      ((processCPUTime + physicalCPUTime) / (elapsedTime * 1000)) * 100;
    /**
     * rss: Physical memory the process is using
     * v8_heap_total: Total heap allocated for v8
     * v8_heap_used: Heap used by v8
     * v8_external: Memory used by v8's C++ objects bound to JavaScript objects managed by v8
     * cpu_usage: CPU usage percentage
     */
    const response = {
      rss: `${RSS} GB`,
      v8_heap_total: `${heapTotal} GB`,
      v8_heap_used: `${heapUsed} GB`,
      v8_external: `${external} GB`,
      cpu_usage: `${cpuUsagePercent.toFixed(2)}%`,
      pool: puppeteerPoolMetrics,
    };
    return responseFn(res, 200, response);
  }, proctorTimeOutMS);
};
