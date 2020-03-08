/*

 https://github.com/alkemics/CancelablePromise

 */

const handleCallback = (resolve: Function, reject: Function, callback: Function, result: any) => {
  try {
    resolve(callback(result))
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

  static reject(value?: any) {
    return new CancelablePromise((y, n) => {
      Promise.reject(value).then(y, n)
    })
  }

  static resolve(value?: any) {
    return new CancelablePromise((y, n) => {
      Promise.resolve(value).then(y, n)
    })
  }

  constructor(executor: (resolve: (value?: any) => void, reject: (reason?: any) => void) => void) {
    // @ts-ignore
    this._promise = new Promise(executor)
    this._canceled = false
  }

  then(success?: Function, error?: Function): CancelablePromise {
    const promise = new CancelablePromise((resolve, reject) => {
      this._promise.then((result) => {
        if (this._canceled) {
          promise.cancel()
        }

        if (success && !this._canceled) {
          handleCallback(resolve, reject, success, result)
        }
        else {
          resolve(result)
        }
      }, (result) => {
        if (this._canceled) {
          promise.cancel()
        }

        if (error && !this._canceled) {
          handleCallback(resolve, reject, error, result)
        }
        else {
          reject(result)
        }
      })
    })

    return promise
  }

  catch(error: Function): object {
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
