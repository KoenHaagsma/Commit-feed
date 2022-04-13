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
        user(login: "dannyfrelink") {
          name
          bioHTML
          avatarUrl
          createdAt
          repositories(orderBy: {field: CREATED_AT, direction: DESC}, first: 100) {
            edges {
              node {
                name
                description
                url
                updatedAt
                defaultBranchRef {
                  target {
                    ... on Commit {
                      history {
                        edges {
                          node {
                            author {
                                name
                            }
                          }
                        }
                      }
                    }
                  }
                }
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

            const commitArray = [];
            baseUrl.repositories.edges[0].node.defaultBranchRef.target.history.edges.forEach((user) => {
                if (user.node.author.name === req.params.author) {
                    commitArray.push(user)
                }
            });

            const dataSet = {
                authorName: baseUrl.name,
                avatarUrl: baseUrl.avatarUrl,
                createdAt: baseUrl.createdAt.split('T')[0],
                bioHTML: baseUrl.bioHTML,
                profileRepositories: repoArray,
                repoAmount: baseUrl.repositories.edges.length,
                commitAmount: commitArray.length
            }

            console.log(dataSet.profileRepositories)

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
