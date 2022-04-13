require('dotenv').config();
const express = require('express');
const { graphql } = require('@octokit/graphql');
const graphqlAuth = graphql.defaults({
    headers: { authorization: 'token ' + process.env.GRAPH_KEY },
});

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', './views');

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/profile', (req, res) => {
    res.render('profile');
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
            const baseURL = data.organization.repository.forks.edges;

            // Add each author to names array to lowercase and replace spaces with underscores
            baseURL.forEach((user) => {
                user.node.defaultBranchRef.target.history.edges.forEach((branch) => {
                    names.push({
                        name: branch.node.author.name.toLowerCase().replace(/ /g, '_'),
                    });
                });
            });

            // Count commit messages per student
            const count = names.reduce((sums, entry) => {
                sums[entry.name] = (sums[entry.name] || 0) + 1;
                return sums;
            }, {});

            // Sort out teachers in count object
            const asArrayStudents = Object.entries(count);
            const filtered = asArrayStudents.filter(([key, value]) => {
                return !(key === 'robert_spier' || key === 'ju5tu5' || key === 'justus_sturkenboom');
            });
            const justStudents = Object.fromEntries(filtered);
            const sortedJustStudents = sortBasedOnValue(justStudents);

            baseURL.forEach((repo) => {
                stats.push({
                    [`${repo.node.owner.login}/${repo.node.name}`]:
                        repo.node.defaultBranchRef.target.history.edges.length,
                });
            });

            const allStats = Object.assign({}, ...stats);
            const sortedAllStats = sortBasedOnValue(allStats);
            console.log(sortedJustStudents);
            console.log(sortedAllStats);

            res.render('scores.ejs', { person_commit_count: sortedAllStats, person_commit_count: sortedJustStudents });
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
        sortedArray.push({ name: key[0], count: key[1] });
    });

    return sortedArray;
}
