require('dotenv').config();
const express = require('express');
const { graphql } = require('@octokit/graphql');
const graphqlAuth = graphql.defaults({
    headers: { authorization: 'token ' + process.env.GRAPH_KEY },
});

const app = express();

app.use(express.static('public'))
app.set('view engine', 'ejs')
app.set('views', './views')

app.get('/', (req, res) => {
    res.render('index')
})

app.get('/profile/:author', (req, res) => {
    graphqlAuth(`query MyQuery {
        user(login: "${req.params.author}") {
          name
          bioHTML
          avatarUrl
          repositories(orderBy: {field: CREATED_AT, direction: DESC}, first: 100) {
            edges {
              node {
                name
                description
                url
                updatedAt
              }
            }
          }
        }
      }`)
        .then(data => {
            const baseUrl = data.user;
            const repoArray = [];
            baseUrl.repositories.edges.forEach(repo => {
                return repoArray.push(repo.node);
            });
            const dataSet = {
                authorName: baseUrl.name,
                avatarUrl: baseUrl.avatarUrl,
                bioHTML: baseUrl.bioHTML,
                profileRepositories: repoArray,
            }

            res.render('profile', { dataSet });
        })
        .catch(err => console.log(err))
})

app.get('/score', (req, res) => {
    res.render('scores');
});

app.use((req, res) => {
    res.status(404).render('error404')
})

app.listen(process.env.PORT, () => {
    console.log(`Application started on port: http://localhost:${process.env.PORT}`)
})
