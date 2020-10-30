const express = require('express');
const app = express();
const hbs = require('express-handlebars');

app.use(express.static('public'))

app.engine('handlebars', hbs({defaultLayout: 'main'}))
app.set('view engine', 'handlebars')

app.get('/', (req,res) => {
    res.render('index');
})

app.get('/secondary', (req, res) => {
    res.render('calendar', {layout: 'secondary'});
});

app.listen(3000, () => {
    console.log("Server is running on port 3000")
})


