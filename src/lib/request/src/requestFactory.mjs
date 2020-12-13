'use strict';

() => {};
/********************************************
 * package: @burro69/request
 *  dependencies
 *      none
 *  exports:
 *      - requestFactory
 ********************************************/

/**
 * RequestError
 */
class RequestError extends Error {
    constructor({ status, statusText }) {//response) {
        super(/* response. */statusText);

        this.name = 'RequestError';
        this.code = /* response. */status;
        //this.response = response;
    }
}

/**
 * requestFactory: add timeout and cancellation fetch like functions
 * @param {Function} fetchFunc 
 * @param {Class} controllerClass 
 */

const requestFactory = (fetchFunc, controllerClass) => {
    const request = (url, options = {}) => {
        const controller = new controllerClass();
        let timeout = null;
        let canceled = false;

        if (options.timeout) {
            timeout = setTimeout(() => {
                controller.abort();
            }, options.timeout);

            delete options.timeout;
        }

        const result = /* () => */ fetchFunc(url, { ...options, signal: controller.signal })
            .then(response => {
                if (!response.ok) 
                    throw new RequestError(response);
                
                return response;
            })
            .then(response => {
                if (options.transformResponse)
                {switch (options.transformResponse.toLowerCase()) {
                    case 'buffer': return response.arrayBuffer();
                    case 'blob': return response.blob();
                    case 'json': return response.json();
                    case 'text': return response.text();
                    case 'form': return response.formData();
                    default: return response;
                }}
                return response;
            })
            .catch(error => {
                if (error.name === 'AbortError')
                {throw new RequestError({
                    statusText: canceled ? `user canceled request at ${url}` : `network timeout at ${url}`,
                    status: 504
                });}
                throw (error);
            })
            .finally(() => {
                if (timeout)
                    clearTimeout(timeout);
            });

        result.cancel = () => {
            canceled = true;
            controller.abort();
        };

        return result;
    };

    request.get = (url, options = {}) => request(url, { ...options, 'method': 'GET' });
    request.post = (url, options = {}) => request(url, { ...options, 'method': 'POST' });
    request.delete = (url, options = {}) => request(url, { ...options, 'method': 'DELETE' });
    request.put = (url, options = {}) => request(url, { ...options, 'method': 'PUT' });
    request.patch = (url, options = {}) => request(url, { ...options, 'method': 'PATCH' });
    request.head = (url, options = {}) => request(url, { ...options, 'method': 'HEAD' });

    request.all = (promises) => Promise.all(promises);
    request.spread = (callback) => (results) => callback.apply(null, results);

    return request;
};

/**
 * default and name exports
 */
export default requestFactory;

export { requestFactory };

/* ADDON: POST automatic transform body

options.body = JSON.stringify(data)
*/

/* ADDON: interceptors

fetch = (originalFetch => {
    return (...args) => {
        const result = originalFetch.apply(this, args);
        return result.then(callback);
    }
})(fetch)
 */

/* ADDON: download progress
// original code: https://github.com/AnthumChris/fetch-progress-indicators
<div id="progress" src="">progress</div>
<img id="img">

<script>

'use strict'

const element = document.getElementById('progress');

fetch('https://fetch-progress.anthum.com/30kbps/images/sunrise-baseline.jpg')
  .then(response => {

    if (!response.ok) {
      throw Error(response.status+' '+response.statusText)
    }

    // ensure ReadableStream is supported
    if (!response.body) {
      throw Error('ReadableStream not yet supported in this browser.')
    }

    // store the size of the entity-body, in bytes
    const contentLength = response.headers.get('content-length');

    // ensure contentLength is available
    if (!contentLength) {
      throw Error('Content-Length response header unavailable');
    }

    // parse the integer into a base-10 number
    const total = parseInt(contentLength, 10);

    let loaded = 0;

    return new Response(

      // create and return a readable stream
      new ReadableStream({
        start(controller) {
          const reader = response.body.getReader();

          read();
          function read() {
            reader.read().then(({done, value}) => {
              if (done) {
                controller.close();
                return;
              }
              loaded += value.byteLength;
              progress({loaded, total})
              controller.enqueue(value);
              read();
            }).catch(error => {
              console.error(error);
              controller.error(error)
            })
          }
        }
      })
    );
  })
  .then(response =>
    // construct a blob from the data
    response.blob()
  )
  .then(data => {
    // insert the downloaded image into the page
    document.getElementById('img').src = URL.createObjectURL(data);
  })
  .catch(error => {
    console.error(error);
  })

function progress({loaded, total}) {
  element.innerHTML = Math.round(loaded/total*100)+'%';
}

</script>
*/


//__ EOF __
