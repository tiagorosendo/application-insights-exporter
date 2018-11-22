const fetch = require('node-fetch')

const applicationInsightsRootUrl = 'https://api.applicationinsights.io'
const appId = process.env.APPID
const appKey = process.env.APPKEY

const appInsightsQueryUrl = applicationInsightsRootUrl + '/v1/apps/' + appId + '/query'

const queries = JSON.parse(process.env.QUERIES)
const dataSetUrl = process.env.DATASETURL

module.exports = async function (context) {
  for (const item of queries) {
    const requestBody = {
      'query': item.query
    }

    const dataSet = await fetch(appInsightsQueryUrl, {
      method: 'post',
      body: JSON.stringify(requestBody),
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
        const propName = item.prefix + '' + table.columns[index].name;
        obj[propName] = item
        return obj
      }, {})))
      .then((dataSet) => {
        context.log(dataSet)
        return dataSet
      })
      .catch(err => context.log(err))

    await fetch(dataSetUrl, {
      method: 'post',
      body: JSON.stringify(dataSet)
    }).then(_ => context.log('The dataSet was sended to PowerBI'))
      .catch(err => context.log(err))
  }

  context.log('Functions is over')
}
