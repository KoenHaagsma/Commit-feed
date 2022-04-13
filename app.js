require('dotenv').config();
const express = require('express');
const { graphql } = require('@octokit/graphql');
const graphqlAuth = graphql.defaults({
    headers: {
        authorization: 'token ' + process.env.GRAPH_KEY,
    },
});

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', './views');

app.get('/', (req, res) => {
    graphqlAuth(`query MyQuery {
        organization(login: "cmda-minor-web") {
          name
          repository(name: "project-2-2122") {
            name
            forks(first: 100) {
              edges {
                node {
                  owner {
                    login
                    avatarUrl
                  }
                  defaultBranchRef {
                    target {
                      ... on Commit {
                        history(first: 100) {
                          edges {
                            node {
                              author {
                                name
                                user {
                                  login
                                  avatarUrl
                                }
                              }
                              message
                              committedDate
                            }
                          }
                        }
                      }
                    }
                  }
                  name
                }
              }
            }
          }
        }
      }`).then((data) => {
        const allCommits = [];
        data.organization.repository.forks.edges.forEach((repo) => {
            repo.node.defaultBranchRef.target.history.edges.forEach((commit) => {
                const key = commit.node.author.name;
                if (
                    key === 'Robert Spier' ||
                    key === 'ju5tu5' ||
                    key === 'Justus Sturkenboom' ||
                    commit.node.author.user === null ||
                    !commit.node.author.user
                ) {
                    return;
                }
                allCommits.push(commit);
            });
        });
        console.log(allCommits);
        allCommits.sort((a, b) => {
            return new Date(b.node.committedDate) - new Date(a.node.committedDate);
        });
        res.render('index', { commits: allCommits });
    });
});

app.get('/profile/:author', (req, res) => {
    graphqlAuth(`query MyQuery {
        user(login: "${req.params.author}") {
          name
          bio
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
                const username = user.node.author.name.split(' ').join('');
                if (username.toLowerCase() === req.params.author) {
                    commitArray.push(user)
                }
            });

            const dataSet = {
                authorName: baseUrl.name,
                avatarUrl: baseUrl.avatarUrl,
                createdAt: baseUrl.createdAt.split('T')[0],
                bio: baseUrl.bio,
                profileRepositories: repoArray,
                repoAmount: baseUrl.repositories.edges.length,
                commitAmount: commitArray.length
            }

            res.render('profile', { dataSet });
        })
        .catch(err => console.log(err))
});

app.get('/score', (req, res) => {
    graphqlAuth(`query MyQuery {
        organization(login: "cmda-minor-web") {
          name
          repository(name: "project-2-2122") {
            name
            forks(first: 100) {
              edges {
                node {
                  owner {
                    login
                    avatarUrl
                  }
                  defaultBranchRef {
                    target {
                      ... on Commit {
                        history(first: 100) {
                          edges {
                            node {
                              author {
                                name
                                user {
                                  login
                                }
                              }
                              message
                            }
                          }
                        }
                      }
                    }
                  }
                  name
                }
                }
            }
            }
        }
    }`)
        .then((data) => {
            const stats = [];
            const names = [];
            const studentsWithURL = [];
            const baseURL = data.organization.repository.forks.edges;

            // Add each author to names array to lowercase and replace spaces with underscores
            baseURL.forEach((user) => {
                user.node.defaultBranchRef.target.history.edges.forEach((branch) => {
                    if (
                        !branch.node.author.user ||
                        branch.node.author.user === null ||
                        branch.node.author.user === undefined
                    ) {
                        return;
                    }
                    names.push({
                        name: branch.node.author.user.login,
                    });
                });
            });

            // branch.node.author.name.toLowerCase().replace(/ /g, '')

            // Count commit messages per student
            const count = names.reduce((sums, entry) => {
                sums[entry.name] = (sums[entry.name] || 0) + 1;
                return sums;
            }, {});

            // Sort out teachers in count object
            const asArrayStudents = Object.entries(count);
            const filtered = asArrayStudents.filter(([key, value]) => {
                return !(key === 'roberrrt-s' || key === 'ju5tu5' || key === 'Justus Sturkenboom');
            });
            const justStudents = Object.fromEntries(filtered);
            const sortedJustStudents = sortBasedOnValue(justStudents);

            baseURL.forEach((repo) => {
                stats.push({
                    [`${repo.node.owner.login}/${repo.node.name}`]: repo.node.defaultBranchRef.target.history.edges.length,
                });
            });

            const allStats = Object.assign({}, ...stats);
            const sortedAllStats = sortBasedOnValue(allStats);

            function getSingleStudentAvatar(object) {
                return graphqlAuth(`query MyQuery {
                    user(login: "${object.name}") {
                        avatarUrl
                    }
                }`)
                    .then((data) => {
                        return {
                            name: object.name,
                            count: object.count,
                            avatarUrl: data.user.avatarUrl,
                        };
                    })
                    .catch((err) => console.log(err));
            }

            const allData = Promise.all(sortedJustStudents.map((object) => getSingleStudentAvatar(object)));
            console.log(
                allData.then((data) => {
                    res.render('scores', { repo_commit_count: sortedAllStats, person_commit_count: data });
                }),
            );
        })
        .catch((err) => {
            console.error(err);
        });
});

app.use((req, res) => {
    res.status(404).render('error404');
});

app.listen(process.env.PORT, () => {
    console.log(`Application started on port: http://localhost:${process.env.PORT}`);
});

// Sort Keys based on values given
function sortBasedOnValue(obj) {
    const sortable = [];
    const sortedArray = [];
    for (var single in obj) {
        sortable.push([single, obj[single]]);
    }

    sortable.sort((a, b) => {
        return b[1] - a[1];
    });

    sortable.forEach((key, value) => {
        sortedArray.push({
            name: key[0],
            count: key[1]
        });
    });

    return sortedArray;
}