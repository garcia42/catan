class Port {
  constructor (v1, v2, resource) {
    this.v1 = v1
    this.v2 = v2
    this.resource = resource
    this.ownerIndex = -1
  }

  getV1 () {
    return this.v1
  }

  getV2 () {
    return this.v2
  }

  getResource () {
    return this.resource
  }

  getOwner () {
    return this.ownerIndex
  }
}

module.exports = Port
