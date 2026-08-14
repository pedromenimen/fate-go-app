import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { ServantService } from '../../services/servant.service';
import { SimpleServant } from '../../types/servant-type';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class DashboardComponent implements OnInit {
  searchValue = new UntypedFormControl();
  options: SimpleServant[] = [];
  filteredServants: SimpleServant[] = [];
  loading = true;

  // Pagination
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [10, 20, 50, 100];
  totalPages = 1;
  pagedServants: SimpleServant[] = [];

  private static readonly PAGE_STORAGE_KEY = 'dashboard.pageSize';
  private static readonly CURRENT_PAGE_STORAGE_KEY = 'dashboard.currentPage';

  constructor(private servantService: ServantService) {
    const savedPageSize = this.readPageSizeFromStorage();
    if (savedPageSize !== null) {
      this.pageSize = savedPageSize;
    }
    const savedCurrentPage = this.readCurrentPageFromStorage();
    if (savedCurrentPage !== null) {
      this.currentPage = savedCurrentPage;
    }
    this.servantService.getServantList().subscribe({
      next: (servantList) => {
        this.options = servantList.filter(
          (servant) => servant.type.toLowerCase() !== 'enemycollectiondetail'
        );
        this.filteredServants = [...this.options];
        this.applyFilter('');
        this.loading = false;
      },
      error: (err: Error) => {
        console.log(err);
        this.loading = false;
      },
    });
  }

  ngOnInit() {
    this.searchValue.valueChanges.subscribe((name: string) => {
      this.applyFilter(name || '');
    });
  }

  applyFilter(name: string): void {
    const filterValue = name.toLowerCase();
    this.filteredServants = this.options.filter((option) =>
      option.name.toLowerCase().includes(filterValue)
    );
    this.currentPage = 1;
    this.updatePage();
  }

  updatePage(): void {
    this.totalPages = Math.max(1, Math.ceil(this.filteredServants.length / this.pageSize));
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedServants = this.filteredServants.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.persistCurrentPage();
    this.updatePage();
  }

  setPageSize(size: number): void {
    this.pageSize = size;
    this.persistPageSize();
    this.updatePage();
  }

  onPageSizeChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    if (!Number.isNaN(value) && this.pageSizeOptions.includes(value)) {
      this.setPageSize(value);
    }
  }

  private readPageSizeFromStorage(): number | null {
    try {
      const raw = localStorage.getItem(DashboardComponent.PAGE_STORAGE_KEY);
      if (raw === null) return null;
      const parsed = Number(raw);
      return this.pageSizeOptions.includes(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  private readCurrentPageFromStorage(): number | null {
    try {
      const raw = localStorage.getItem(DashboardComponent.CURRENT_PAGE_STORAGE_KEY);
      if (raw === null) return null;
      const parsed = Number(raw);
      return Number.isInteger(parsed) && parsed >= 1 ? parsed : null;
    } catch {
      return null;
    }
  }

  private persistPageSize(): void {
    try {
      localStorage.setItem(DashboardComponent.PAGE_STORAGE_KEY, String(this.pageSize));
    } catch {
      /* ignore quota / privacy errors */
    }
  }

  private persistCurrentPage(): void {
    try {
      localStorage.setItem(DashboardComponent.CURRENT_PAGE_STORAGE_KEY, String(this.currentPage));
    } catch {
      /* ignore quota / privacy errors */
    }
  }

  displayFn(user: SimpleServant): string {
    return user && user.name ? user.name : '';
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }
}
