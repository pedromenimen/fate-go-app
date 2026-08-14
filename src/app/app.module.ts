import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { TesteComponent } from './components/teste/teste/teste.component';
import { CardComponent } from './pages/dashboard/card/card.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { HomeComponent } from './pages/home/home.component';
import { AccordionComponent } from './pages/servant-details/accordion/accordion.component';
import { ServantDetailsComponent } from './pages/servant-details/servant-details.component';

@NgModule({ declarations: [
        AppComponent,
        CardComponent,
        HomeComponent,
        DashboardComponent,
        FooterComponent,
        HeaderComponent,
        TesteComponent,
        ServantDetailsComponent,
        AccordionComponent,
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        AppRoutingModule,
        FormsModule,
        BrowserAnimationsModule,
        MatFormFieldModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        ReactiveFormsModule,
        NgbModule,
        MatExpansionModule], providers: [provideHttpClient(withXhr(), withInterceptorsFromDi())] })
export class AppModule {}
