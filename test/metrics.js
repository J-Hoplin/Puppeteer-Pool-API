import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5s', target: 150 }, // 5s 150 user
  ],
};

export default function () {
  http.get('http://127.0.0.1:5200/health/metrics');
  sleep(1);
}
