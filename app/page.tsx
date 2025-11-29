import Calendar from "@/app/components/Calendar";

export default function Home() {
  return (
    <main className=" mx-auto lg:w-[80%] md:w-[90%] w-[95%] mb-20 mt-5 bg-[#f5f7fb] dark:bg-gray-900 min-h-screen transition-colors">
      <Calendar />
    </main>
  );
}
