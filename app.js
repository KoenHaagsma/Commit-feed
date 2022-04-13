require('dotenv').config();
const express = require('express');
const {
    graphql
} = require('@octokit/graphql');
const graphqlAuth = graphql.defaults({
    headers: {
        authorization: 'token ' + process.env.GRAPH_KEY
    },
});

const app = express();

app.use(express.static('public'))
app.set('view engine', 'ejs')
app.set('views', './views')

app.get('/', (req, res) => {
    res.render('index')
})

app.get('/profile', (req, res) => {
    res.render('profile')
})

app.get('/score', (req, res) => {
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
            console.log(data.organization.repositories.edges[0].node.forks.edges[0].node.owner.login);
            console.log(data.organization.repositories.edges[0].node.forks.edges[0].node.defaultBranchRef.target.history.edges.length);
            console.log(data.organization.repositories.edges[0].node.forks.edges[0].node.defaultBranchRef.repository.name)

            const dataSet = {
                ownerName: data.organization.repositories.edges[0].node.forks.edges[0].node.owner.login,
                lengthCommits: data.organization.repositories.edges[0].node.forks.edges[0].node.defaultBranchRef.target.history.edges.length
            }

            res.render('index', {
                dataSet
            });
        })
        .catch(err => console.log(err))

    res.render('scores');
});

app.use((req, res) => {
    res.status(404).render('error404')
})

app.listen(process.env.PORT, () => {
    console.log(`Application started on port: http://localhost:${process.env.PORT}`)
})