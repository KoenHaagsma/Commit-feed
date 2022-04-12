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
    graphqlAuth(`query MyQuery {
        organization(login: "cmda-minor-web") {
          name
          repositories(last: 1) {
            edges {
              node {
                name
                forks(first: 100) {
                  edges {
                    node {
                      owner {
                        login
                      }
                      defaultBranchRef {
                        repository {
                          name
                        }
                        target {
                          ... on Commit {
                            history(first: 100) {
                              edges {
                                node {
                                  author {
                                    name
                                    user {
                                      avatarUrl
                                      bioHTML
                                      repositories(last: 10) {
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
                                  }
                                  message
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
          }
        }
      }`)
        .then(data => {
            console.log(data.organization.repositories.edges[0].node.forks.edges[0].node.defaultBranchRef.target.history.edges[0].node.author.name);
            console.log(data.organization.repositories.edges[0].node.forks.edges[0].node.defaultBranchRef.target.history.edges[0].node.author.user.avatarUrl);
            console.log(data.organization.repositories.edges[0].node.forks.edges[0].node.defaultBranchRef.target.history.edges[0].node.author.user.bioHTML);
            console.log(data.organization.repositories.edges[0].node.forks.edges[0].node.defaultBranchRef.target.history.edges[0].node.author.user.repositories.edges[0].node.name)
            console.log(data.organization.repositories.edges[0].node.forks.edges[0].node.defaultBranchRef.target.history.edges[0].node.author.user.repositories.edges[0].node.description)
            console.log(data.organization.repositories.edges[0].node.forks.edges[0].node.defaultBranchRef.target.history.edges[0].node.author.user.repositories.edges[0].node.url)
            console.log(data.organization.repositories.edges[0].node.forks.edges[0].node.defaultBranchRef.target.history.edges[0].node.author.user.repositories.edges[0].node.updatedAt)

            res.render('index');
        })
        .catch(err => console.log(err))
})

app.get('/profile', (req, res) => {
    res.render('profile')
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
