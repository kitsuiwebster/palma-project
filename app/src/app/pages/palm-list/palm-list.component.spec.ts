import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PalmListComponent } from './palm-list.component';

describe('PalmListComponent', () => {
  let component: PalmListComponent;
  let fixture: ComponentFixture<PalmListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PalmListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PalmListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
