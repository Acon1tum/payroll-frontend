import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SettingsService } from './services/settings.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'payroll-frontend';

  constructor(private settingsService: SettingsService) {}

  ngOnInit() {
    // ✅ Initialize timezone service at application startup
    this.settingsService.initializeTimezone();
  }
}
