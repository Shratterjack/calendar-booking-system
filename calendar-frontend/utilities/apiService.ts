interface IAPICall {
  path: string
  requestOptions: {
    method: string
    body?: Record<string, unknown>
  }
}

interface IRequestOptions {
  method: IAPICall['requestOptions']['method']
  body?: string
  headers?: Headers
}

export async function apiCall({ path, requestOptions }: IAPICall) {
  try {
    const url = `${import.meta.env.VITE_API_BASE_URL}${path}`

    const options: IRequestOptions = {
      method: requestOptions.method,
    }

    if (options.method === 'POST') {
      const headers = new Headers()
      headers.append('Content-Type', 'application/json')
      options.headers = headers
      options.body = JSON.stringify(requestOptions.body)
    }

    const response = await fetch(url, options)
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`)
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    // console.error(error.message);
  }
}
