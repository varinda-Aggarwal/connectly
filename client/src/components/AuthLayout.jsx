import authBg from "../assets/auth-bg.png";

export default function AuthLayout({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-page">
      <img
        src={authBg}
        alt=""
        className="absolute inset-0 hidden h-full w-full object-cover object-left-top lg:block"
      />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-6 lg:justify-end lg:pr-[16vw]">
        <div className="w-full max-w-md rounded-3xl border border-line bg-card/95 p-6 shadow-xl backdrop-blur sm:p-8">
          <p className="mb-6 text-center font-serif text-2xl font-semibold text-primary-dark lg:hidden">
            Connectly
          </p>
          {children}
        </div>
      </div>
    </div>
  );
}