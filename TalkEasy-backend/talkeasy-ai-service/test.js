import jwt from 'jsonwebtoken';

async function test() {
  const token = jwt.sign({ user_id: 'test' }, '8f3d7c9a1b6e4f2d9c5a7e1f8b3c6d4e', { expiresIn: '1d' });
  const res = await fetch('http://localhost:3002/api/chat/text/1234', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ text: 'Hello' })
  });
  const text = await res.text();
  console.log('STATUS:', res.status);
  console.log('RESPONSE:', text);
}

test();
