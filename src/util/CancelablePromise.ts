/*

 https://github.com/alkemics/CancelablePromise

 */

const handleCallback = (resolve, reject, callback, r) => {
  try {
    resolve(callback(r))
  }
  catch (e) {
    reject(e)
  }
}


class CancelablePromise {

  private _promise: Promise<any>
  private _canceled: boolean

  static all(iterable: Array<Promise<any>>) {
    return new CancelablePromise((y, n) => {
      Promise.all(iterable).then(y, n)
    })
  }

  static race(iterable: Array<Promise<any>>) {
    return new CancelablePromise((y, n) => {
      Promise.race(iterable).then(y, n)
    })
  }

  static reject(value: any) {
    return new CancelablePromise((y, n) => {
      Promise.reject(value).then(y, n)
    })
  }

  static resolve(value: any) {
    return new CancelablePromise((y, n) => {
      Promise.resolve(value).then(y, n)
    })
  }

  constructor(executor: (resolve: (value?: any) => void, reject: (reason?: any) => void) => void) {
    // @ts-ignore
    this._promise = new Promise(executor)
    this._canceled = false
  }

  then(success?, error?): CancelablePromise {
    const promise = new CancelablePromise((resolve, reject) => {
      this._promise.then((r) => {
        if (this._canceled) {
          promise.cancel()
        }

        if (success && !this._canceled) {
          handleCallback(resolve, reject, success, r)
        }
        else {
          resolve(r)
        }
      }, (r) => {
        if (this._canceled) {
          promise.cancel()
        }

        if (error && !this._canceled) {
          handleCallback(resolve, reject, error, r)
        }
        else {
          reject(r)
        }
      })
    })

    return promise
  }

  catch(error: Error): object {
    return this.then(undefined, error)
  }

  cancel(errorCallback?: Function) {
    this._canceled = true

    if (errorCallback) {
      // @ts-ignore
      this._promise.catch(errorCallback)
    }

    return this
  }
}


export default CancelablePromise
