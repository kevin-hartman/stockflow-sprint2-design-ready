import { FileStockForm } from "../components/FileStockForm";

export function FileStockPage() {
  return (
    <main className="page">
      <div className="page__header">
        <h1 className="page__title">
          <img className="page__title-icon" src="/favicon.svg" alt="" />
          <span>File stock</span>
        </h1>
      </div>
      <FileStockForm />
    </main>
  );
}
