import Background from "../../Components/Branding/Background"
import Logo from "../../Components/Branding/Logo"

export default function ErrorPage({ status }) {
    const title = {
      503: 'Service Unavailable',
      500: 'Server Error',
      404: 'Page Not Found',
      403: 'Forbidden',
    }[status]
  
    const description = {
      503: 'Sorry, we are doing some maintenance. Please check back soon.',
      500: 'Whoops, something went wrong on our servers.',
      404: 'Sorry, the page you are looking for could not be found.',
      403: 'Sorry, you are forbidden from accessing this page.',
    }[status]
  
    return (
      <div className="h-screen">
        <div className="relative isolate px-6 pt-14 lg:px-8">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 -top-72 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-[35rem]"
          >
            <div
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
              className="relative h-screen left-[calc(50%-11rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#fbca8e] to-[#fff6ae] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            />
          </div>
          <div className="absolute inset-x-0 inset-y-0 w-full h-screen bg-black/5 backdrop-blur-md -z-10">

          </div>
          <div className="mx-auto max-w-2xl py-32 lg:py-56">
            <div className="text-center">
              <div className="scale-[2] -mt-0 lg:-mt-10 pb-16">
                <Logo includeTitle={false} error={true}></Logo>
              </div>
              <div className="pb-4 text-3xl scale-150 font-extrabold bg-gradient-to-tr from-orange-400 to-orange-600 bg-clip-text text-transparent drop-shadow-lg">
                <span className="font-mono">{status}</span>
                <div className="fixed inset-0 w-screen h-screen left-0 top-0 bg-red-600/20 z-20"></div>
              </div>
              <h1 className="text-5xl font-semibold tracking-tight text-balance text-gray-900 sm:text-7xl">
                {title}
              </h1>
              <p className="mt-8 text-lg font-medium text-pretty text-gray-500 sm:text-xl/8">
                {description}
              </p>
              <div>
                <a href="/" className="inline-block px-4 py-2 mt-10 text-md font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition duration-200 ease-in-out">
                  Go back Home
                </a>
                <a href="https://wings.angelfs.co.uk" className="inline-block px-4 py-2 mt-10 ml-4 text-md font-semibold text-gray-700 hover:text-gray-900 transition duration-200 ease-in-out">
                  Back to Wings
                  <span className="pl-2" aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-[calc(100%-10rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-45rem)]"
          >
            <div
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
              className="relative h-screen left-[calc(50%+3rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#fbca8e] to-[#fff6ae] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
            />
          </div>
        </div>
      </div>
    )
}


