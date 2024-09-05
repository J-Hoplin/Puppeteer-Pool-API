import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5s', target: 150 }, // 5s 150 user
  ],
};

export default function () {
  const payload = JSON.stringify({
    url: 'URL',
  });
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  http.post('http://127.0.0.1:3000', payload, params);
  sleep(1);
}
