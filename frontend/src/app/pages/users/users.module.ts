// Reúne las importaciones utilizadas por la pantalla de Gestión de usuarios.

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonFooter,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { UsersPage } from './users.page';
import { UsersPageRoutingModule } from './users-routing.module';

@NgModule({
  imports: [
    CommonModule,
    IonBackButton,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonContent,
    IonFooter,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonModal,
    IonTitle,
    IonToolbar,
    UsersPageRoutingModule,
  ],
  declarations: [UsersPage],
})
export class UsersPageModule {}
