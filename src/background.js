console.log('Started background script')

// function listener(details) {
//   console.log('listener', {details})
//   // let filter = browser.webRequest.filterResponseData(details.requestId)
//   // let decoder = new TextDecoder("utf-8")
//   // let encoder = new TextEncoder()
//
//   // filter.ondata = event => {
//   //   console.log('ondata', {event})
//   //   // let str = decoder.decode(event.data, {stream: true})
//   //   // filter.write(encoder.encode(str))
//   //   filter.write(encoder.encode(event.data))
//   //   filter.disconnect()
//   // }
//
//   // return {}; // not needed
//
// }
//
// browser.webRequest.onBeforeRequest.addListener(
//   listener,
//   {
//     urls: [
//       "<all_urls>"
//     ],
//     types: ["main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"]
//   },
//   ["blocking"]
// )
//
// var opts = {
//   method: 'GET',
//   headers: {}
// }
// fetch('https://www.reddit.com', opts).then(function (response) {
//   return response.json()
// })
//   .then(function (body) {
//     console.log({body})
//     // doSomething with body;
//   })
