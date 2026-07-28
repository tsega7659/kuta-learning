
const login = await fetch('http://localhost:4000/api/auth/login', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@kuta.com', password: 'admin123' })
}).then(r => r.json());

const courseRes = await fetch('http://localhost:4000/api/courses', {
  headers: { 'Authorization': 'Bearer ' + login.token }
}).then(r => r.json());

const fullCourse = await fetch('http://localhost:4000/api/courses/' + courseRes[0].id, {
  headers: { 'Authorization': 'Bearer ' + login.token }
}).then(r => r.json());

const firstChapter = fullCourse.chapters[0];

const topicRes = await fetch('http://localhost:4000/api/courses/' + fullCourse.id + '/chapters/' + firstChapter.id + '/topics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + login.token },
  body: JSON.stringify({ title: 'Duplicate Order Topic', order: 1 })
}).then(r => r.json());

console.log(topicRes);

