const noop = () => {}

class Deffer<T = any> {
  promise: Promise<T>
  resolve: (value?: any) => any = noop
  reject: (reason?: any) => any = noop
  constructor() {
    this.promise = new Promise<T>((resolve, rejest) => {
      this.resolve = resolve
      this.reject = rejest
    })
  }
}

export default Deffer