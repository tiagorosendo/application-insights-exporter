const fetch = require('node-fetch')

const applicationInsightsRootUrl = 'https://api.applicationinsights.io'
const appId = process.env.APPID
const appKey = process.env.APPKEY

const appInsightsQueryUrl = applicationInsightsRootUrl + '/v1/apps/' + appId + '/query'
const dependenciesDataSetUrl = process.env.DATASETURL

module.exports = async function (context) {
  const requestCount = {
    'query': 'dependencies | where timestamp > ago(5m) | where operation_Name == "POST Split/Post" | summarize avgRequestDuration=avg(duration) by name, bin(timestamp, 1m)'
  }

  const dataSet = await fetch(appInsightsQueryUrl, {
    method: 'post',
    body: JSON.stringify(requestCount),
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': appKey
    }
  })
    .then(res => res.json())
    .then(table => table.tables[0])
    .then(table => {
      const columns = table.columns
      const rows = table.rows
      return {
        columns,
        rows
      }
    })
    .then(table => table.rows.map(elem => elem.reduce((obj, item, index) => {
      obj[table.columns[index].name] = item
      return obj
    }, {})))
    .catch(err => console.log(err))

  await fetch(dependenciesDataSetUrl, {
    method: 'post',
    body: JSON.stringify(dataSet)
  }).then(_ => context.log('The dataSet was sended to PowerBI'))
    .catch(err => console.log(err))

  context.log('Functions is over')
}
