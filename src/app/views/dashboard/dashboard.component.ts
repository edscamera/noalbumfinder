import { Component } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ReportService } from '../../services/report.service';

@Component({
  selector: 'app-dashboard',
  imports: [InputTextModule, ButtonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  constructor(public reportService: ReportService) {}

  public createReport(username: string): void {
    this.reportService.createReport(username, 400).subscribe({
      next: (report) => console.log(report),
    });
  }
}
