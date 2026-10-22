const express = require('express');
const fs = require('fs'); 
const path = require('path');
const crypto = require('crypto'); 

const app = express();
const PORT = process.env.PORT || 3000; 
app.use(express.static('public')); 

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

function readData() {
    const data = fs.readFileSync('data.json', 'utf-8');
    return JSON.parse(data);
}
function writeData(data) {
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
}



// 1.список форм
app.get('/admin', (req, res) => {
    const data = readData();
    res.render('admin', { forms: data.forms });
});

// 2. создание новой формы (сохранение)
app.post('/admin/create', (req, res) => {
    const data = readData();
    
    let titles = req.body.fieldLabel; 
    let types = req.body.fieldType;   
    
    if (!Array.isArray(titles)) titles = [titles];
    if (!Array.isArray(types)) types = [types];

    const fields = titles.map((title, index) => {
        return {
            id: 'field_' + index, 
            label: title,         
            type: types[index]    
        };
    });

    const newForm = {
        id: crypto.randomUUID(),
        title: req.body.title,
        fields: fields, 
        responses: []
    };

    data.forms.push(newForm);
    writeData(data);
    res.redirect('/admin');
});

// 3. публичная страница формы (то, что видит студент)
app.get('/form/:id', (req, res) => {
    const data = readData();
    const form = data.forms.find(f => f.id === req.params.id);
    
    if (!form) return res.status(404).send('Форма не найдена');
    res.render('form', { form });
});

// 4. отправка ответа студентом
app.post('/form/:id', (req, res) => {
    const data = readData();
    const form = data.forms.find(f => f.id === req.params.id);
    
    if (form) {
        form.responses.push({ answers: req.body, date: new Date() });
        writeData(data);
        
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Успех</title>
                <link rel="stylesheet" href="/style.css">
            </head>
            <body>
                <div class="container" style="text-align: center;">
                    <h1 style="color: #27ae60;">Спасибо! 🎉</h1>
                    <p style="font-size: 18px;">Ваш ответ успешно отправлен.</p>
                    <br>
                    <a href="/admin" style="text-decoration: none;">
                        <button style="background-color: #3498db;">Вернуться в управление</button>
                    </a>
                </div>
            </body>
            </html>
        `);
    } else {
        res.status(404).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Ошибка 404</title>
                <link rel="stylesheet" href="/style.css">
            </head>
            <body>
                <div class="container" style="text-align: center;">
                    <h1 style="color: #e74c3c;">Ошибка 404 😢</h1>
                    <p style="font-size: 18px;">Форма не найдена. Возможно, ссылка устарела или была удалена.</p>
                    <br>
                    <a href="/admin" style="text-decoration: none;">
                        <button style="background-color: #7f8c8d;">Перейти в управление</button>
                    </a>
                </div>
            </body>
            </html>
        `);
    }
});

// 5. Страница просмотра ответов 
app.get('/admin/forms/:id', (req, res) => {
    const data = readData();
    const form = data.forms.find(f => f.id === req.params.id);
    
    if (!form) return res.status(404).send('Форма не найдена');
    res.render('responses', { form: form });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}/admin`);
});