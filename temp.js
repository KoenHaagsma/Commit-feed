query MyQuery {
    organization(login: "cmda-minor-web") {
      name
      repository(name: "project-2-2122") {
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
                    history(last: 100) {
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